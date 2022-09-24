import * as React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import {store} from "./store";
import { ConfigProvider } from 'antd';
import ru_RU from 'antd/lib/locale-provider/ru_RU';
import App from './pages/App/App';
import { BrowserRouter } from 'react-router-dom';

render(
  <Provider store={store}>
    <ConfigProvider locale={ru_RU}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </Provider>
  , document.querySelector('#app'));
