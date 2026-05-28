using System;
using System.IO;
using System.Net;
using System.Text;

namespace KeePassBrowserBridge.Bridge
{
    internal sealed class LoopbackBridgeServer : IDisposable
    {
        private readonly BridgeRequestHandler m_handler;
        private HttpListener m_listener;
        private bool m_running;

        public LoopbackBridgeServer(BridgeRequestHandler handler)
        {
            if (handler == null) throw new ArgumentNullException("handler");
            m_handler = handler;
        }

        public bool IsRunning
        {
            get { return m_running; }
        }

        public string Prefix { get; private set; }

        public void Start(int port)
        {
            BridgeServerStartResult result = TryStart(port);
            if (!result.Success) throw result.Exception;
        }

        public BridgeServerStartResult TryStart(int port)
        {
            if (m_running) return BridgeServerStartResult.Ok(Prefix);

            Stop();
            Prefix = "http://127.0.0.1:" + port + "/";
            m_listener = new HttpListener();
            m_listener.Prefixes.Add(Prefix);
            try
            {
                m_listener.Start();
                m_running = true;
                BeginAccept();
                return BridgeServerStartResult.Ok(Prefix);
            }
            catch (HttpListenerException ex)
            {
                Stop();
                return BridgeServerStartResult.Fail("port_unavailable",
                    "Failed to listen on " + Prefix + ". Another KeePassBrowserBridge instance or another process may already be using this port.",
                    ex);
            }
            catch (Exception ex)
            {
                Stop();
                return BridgeServerStartResult.Fail("server_start_failed", ex.Message, ex);
            }
        }

        public void Stop()
        {
            m_running = false;

            if (m_listener != null)
            {
                try { m_listener.Stop(); }
                catch { }

                try { m_listener.Close(); }
                catch { }

                m_listener = null;
            }
        }

        public void Dispose()
        {
            Stop();
        }

        private void BeginAccept()
        {
            if (!m_running || m_listener == null) return;

            try
            {
                m_listener.BeginGetContext(OnContextReceived, null);
            }
            catch
            {
                if (m_running) Stop();
            }
        }

        private void OnContextReceived(IAsyncResult asyncResult)
        {
            HttpListenerContext context = null;
            try
            {
                if (m_listener == null) return;
                context = m_listener.EndGetContext(asyncResult);
            }
            catch
            {
                return;
            }
            finally
            {
                BeginAccept();
            }

            ProcessContext(context);
        }

        private void ProcessContext(HttpListenerContext context)
        {
            if (context.Request.HttpMethod == "OPTIONS")
            {
                if (!AddCorsHeadersForAllowedOrigin(context.Request, context.Response))
                {
                    context.Response.StatusCode = 403;
                    context.Response.Close();
                    return;
                }

                context.Response.StatusCode = 204;
                context.Response.Close();
                return;
            }

            AddCorsHeadersForAllowedOrigin(context.Request, context.Response);

            if (context.Request.HttpMethod != "POST" || context.Request.Url == null ||
                !string.Equals(context.Request.Url.AbsolutePath, "/bridge", StringComparison.OrdinalIgnoreCase))
            {
                context.Response.StatusCode = 404;
                context.Response.Close();
                return;
            }

            BridgeResponse response;
            try
            {
                string body;
                using (StreamReader reader = new StreamReader(context.Request.InputStream, context.Request.ContentEncoding ?? Encoding.UTF8))
                {
                    body = reader.ReadToEnd();
                }

                BridgeRequest request = BridgeJsonSerializer.Deserialize<BridgeRequest>(body);
                response = m_handler.Handle(request);
                context.Response.StatusCode = 200;
            }
            catch (Exception ex)
            {
                response = new BridgeResponse
                {
                    ProtocolVersion = ProtocolValidator.ProtocolVersion,
                    Success = false,
                    ErrorCode = "server_error",
                    Error = ex.Message
                };
                context.Response.StatusCode = 500;
            }

            byte[] bytes = Encoding.UTF8.GetBytes(BridgeJsonSerializer.Serialize(response));
            context.Response.ContentType = "application/json";
            context.Response.ContentEncoding = Encoding.UTF8;
            context.Response.ContentLength64 = bytes.Length;
            context.Response.OutputStream.Write(bytes, 0, bytes.Length);
            context.Response.Close();
        }

        private static bool AddCorsHeadersForAllowedOrigin(HttpListenerRequest request, HttpListenerResponse response)
        {
            string origin = request.Headers["Origin"];
            if (!string.IsNullOrWhiteSpace(origin))
            {
                if (!ProtocolValidator.IsAllowedExtensionOrigin(origin)) return false;
                response.Headers["Access-Control-Allow-Origin"] = origin;
                response.Headers["Vary"] = "Origin";
            }

            response.Headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
            response.Headers["Access-Control-Allow-Headers"] = "Content-Type";
            return true;
        }
    }

    internal sealed class BridgeServerStartResult
    {
        public bool Success { get; set; }
        public string Prefix { get; set; }
        public string ErrorCode { get; set; }
        public string Error { get; set; }
        public Exception Exception { get; set; }

        public static BridgeServerStartResult Ok(string prefix)
        {
            return new BridgeServerStartResult
            {
                Success = true,
                Prefix = prefix
            };
        }

        public static BridgeServerStartResult Fail(string errorCode, string error, Exception exception)
        {
            return new BridgeServerStartResult
            {
                Success = false,
                ErrorCode = errorCode,
                Error = error,
                Exception = exception
            };
        }
    }
}
