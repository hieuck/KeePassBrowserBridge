using System.IO;
using System.Runtime.Serialization.Json;
using System.Text;

namespace KeePassBrowserBridge.Bridge
{
    internal static class BridgeJsonSerializer
    {
        public static string Serialize<T>(T value)
        {
            DataContractJsonSerializer serializer = new DataContractJsonSerializer(typeof(T));
            using (MemoryStream stream = new MemoryStream())
            {
                serializer.WriteObject(stream, value);
                return Encoding.UTF8.GetString(stream.ToArray());
            }
        }

        public static T Deserialize<T>(string json)
        {
            DataContractJsonSerializer serializer = new DataContractJsonSerializer(typeof(T));
            using (MemoryStream stream = new MemoryStream(Encoding.UTF8.GetBytes(json ?? "{}")))
            {
                return (T)serializer.ReadObject(stream);
            }
        }
    }
}
