import {
  Avatar,
  Button,
  Card,
  Checkbox,
  ConfigProvider,
  Descriptions,
  DescriptionsItem,
  Empty,
  Form,
  FormItem,
  Input,
  InputNumber,
  InputPassword,
  InputSearch,
  Menu,
  MenuItem,
  Popconfirm,
  Select,
  SelectOption,
  Slider,
  Space,
  Switch,
  Tag,
  Tooltip,
  TreeSelect,
  message,
} from 'ant-design-vue';

export function registerAntd(app) {
  app.use(Avatar)
     .use(Button)
     .use(Card)
     .use(Checkbox)
     .use(ConfigProvider)
     .use(Descriptions)
     .use(DescriptionsItem)
     .use(Empty)
     .use(Form)
     .use(FormItem)
     .use(Input)
     .use(InputNumber)
     .use(InputPassword)
     .use(InputSearch)
     .use(Menu)
     .use(MenuItem)
     .use(Popconfirm)
     .use(Select)
     .use(SelectOption)
     .use(Slider)
     .use(Space)
     .use(Switch)
     .use(Tag)
     .use(Tooltip)
     .use(TreeSelect);
  app.config.globalProperties.$message = message;
}
