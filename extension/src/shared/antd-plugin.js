import {
  Button,
  Card,
  ConfigProvider,
  Descriptions,
  DescriptionsItem,
  Empty,
  FormItem,
  Input,
  InputNumber,
  InputSearch,
  Menu,
  MenuItem,
  Popconfirm,
  Select,
  SelectOption,
  Space,
  Switch,
  Tag,
} from 'ant-design-vue';

export function registerAntd(app) {
  app.use(Button)
     .use(Card)
     .use(ConfigProvider)
     .use(Descriptions)
     .use(DescriptionsItem)
     .use(Empty)
     .use(FormItem)
     .use(Input)
     .use(InputNumber)
     .use(InputSearch)
     .use(Menu)
     .use(MenuItem)
     .use(Popconfirm)
     .use(Select)
     .use(SelectOption)
     .use(Space)
     .use(Switch)
     .use(Tag);
}
