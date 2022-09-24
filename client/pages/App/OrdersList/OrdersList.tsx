import { List, Tooltip } from 'antd';
import VirtualList from 'rc-virtual-list';
import * as React from 'react';
import { FC, useEffect, useLayoutEffect, useState } from 'react';
import { Order, OrderType, OrderTypeNames, OrderViewItem } from '../models';
import './OrdersList.styles.less';
import {UploadOutlined, DownloadOutlined} from '@ant-design/icons';

interface Props {
  selectedId?: number;
  orders: OrderViewItem[];
  onSelect?: (id: number) => void;
}

const OrdersList: FC<Props> = ({selectedId, orders = [], onSelect}) => {
  const [innerSelectedId, setSelectedId] = useState<number | undefined>(selectedId);

  useEffect(() => {
    setSelectedId(selectedId)
  }, [selectedId])

  const [size, setSize] = useState([0, 0]);
  useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const onSelected = (order: Order) => {
    setSelectedId(order.id);
    onSelect?.(order.id);
  }

  return (<List
    className="list-wrapper"
    bordered>
    <VirtualList
      data={orders}
      height={size[1] - 47 * 2}
      itemHeight={47}
      itemKey="id"
    >
      {(item: OrderViewItem) => (
        <List.Item key={item.id} className={innerSelectedId === item.id ? 'list-item selected' : 'list-item'} onClick={() => onSelected(item)}>
          <List.Item.Meta
            title={item.client?.name}
            avatar={<Tooltip title={OrderTypeNames[item.type]}>{item.type === OrderType.Pickup ? <UploadOutlined style={{fontSize: 24, color: 'red'}}/> : <DownloadOutlined style={{fontSize: 24, color: 'green'}}/>}</Tooltip>}
            description={<strong>{OrderTypeNames[item.type]}</strong>}
          />
          <div>{new Intl.NumberFormat('ru-RU', {style: 'currency', currency: 'RUB'}).format(item.price)}</div>
        </List.Item>
      )}
    </VirtualList>
  </List>)
}

export default OrdersList;
