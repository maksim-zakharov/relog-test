import * as React from 'react';
import { useYMaps } from '../../hooks/useYMaps';
import { useEffect, useMemo } from 'react';
import './App.styles.less';
import * as YMaps from 'yandex-maps';
import { useGetClientsQuery, useGetOrdersQuery } from './App.store';
import { Order, OrderTypeNames, OrderViewItem } from './models';
import { Card } from 'antd';
import OrdersList from './OrdersList/OrdersList';
import { useSearchParams } from 'react-router-dom';
import { Clusterer } from 'yandex-maps';

const App = () => {

  const [searchParams, setSearchParams] = useSearchParams();

  const selectedId = Number(searchParams.get('orderId'));

  const defaultZoom = 13;
  const selectedZoom = 18;

  const ymaps = useYMaps<typeof YMaps>();

  const { data: clients = [] } = useGetClientsQuery({});
  const { data: orders = [] } = useGetOrdersQuery({});

  const clientsMap = useMemo(() => {
    const clientsMap = new Map<number, any>();
    clients.map((client) => clientsMap.set(client.id, client));

    return clientsMap;
  }, [clients]);

  const ordersWithClients = useMemo(() => orders.map((order) => ({
    ...order,
    client: clientsMap.get(order.client_id),
  })) as OrderViewItem[], [orders, clientsMap]);

  const defaultMapCoordsCenter = [43.238949, 76.889709];

  /**
   * Функция возвращает объект, содержащий данные метки.
   * Поле данных clusterCaption будет отображено в списке геообъектов в балуне кластера.
   * Поле balloonContentBody - источник данных для контента балуна.
   * Оба поля поддерживают HTML-разметку.
   * Список полей данных, которые используют стандартные макеты содержимого иконки метки
   * и балуна геообъектов, можно посмотреть в документации.
   * @see https://api.yandex.ru/maps/doc/jsapi/2.1/ref/reference/GeoObject.xml
   */
  const getPointData = (order: OrderViewItem) => {
    return {
      id: order.id,
      balloonContentHeader: 'ID Заказа: <strong>' + order.id + '</strong>',
      balloonContentBody: `<div>` + order.client?.name + ' ' + new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
      }).format(order.price) + `</div>`,
    };
  };
  /**
   * Функция возвращает объект, содержащий опции метки.
   * Все опции, которые поддерживают геообъекты, можно посмотреть в документации.
   * @see https://api.yandex.ru/maps/doc/jsapi/2.1/ref/reference/GeoObject.xml
   */
  const getPointOptions = (order: OrderViewItem) => {
    return {
      orderId: order.id,
      preset: order.id === selectedId ? 'islands#redStretchyIcon' : 'islands#violetIcon',
    };
  };

  const placeMarks = useMemo(() => {
    if (!ymaps) {
      return [];
    }

    return ordersWithClients.map((order, i) => {
      const placeMark = new ymaps.Placemark([order.coords.lat, order.coords.long], getPointData(order), getPointOptions(order));

      // placeMark.events.add('mouseenter', () => {
      //   placeMark.balloon.open();
      // })

      return placeMark;
    });

  }, [ymaps, ordersWithClients, selectedId]);

  const clusterer = useMemo(() => {

    if (!ymaps) {
      return undefined;
    }

    const clusterer = new ymaps.Clusterer({
      /**
       * Через кластеризатор можно указать только стили кластеров,
       * стили для меток нужно назначать каждой метке отдельно.
       * @see https://api.yandex.ru/maps/doc/jsapi/2.1/ref/reference/option.presetStorage.xml
       */
      preset: 'islands#invertedVioletClusterIcons',
      /**
       * Ставим true, если хотим кластеризовать только точки с одинаковыми координатами.
       */
      groupByCoordinates: false,
      /**
       * Опции кластеров указываем в кластеризаторе с префиксом "cluster".
       * @see https://api.yandex.ru/maps/doc/jsapi/2.1/ref/reference/ClusterPlacemark.xml
       */
      // @ts-ignore
      // clusterDisableClickZoom: true,
      clusterHideIconOnBalloonOpen: false,
      geoObjectHideIconOnBalloonOpen: false,
      gridSize: 80,
    });

    /**
     * В кластеризатор можно добавить javascript-массив меток (не геоколлекцию) или одну метку.
     * @see https://api.yandex.ru/maps/doc/jsapi/2.1/ref/reference/Clusterer.xml#add
     */
    clusterer.add(placeMarks);

    return clusterer;
  }, [ymaps, placeMarks]);

  const map = useMemo(() => ymaps && new ymaps.Map('map', {
    center: defaultMapCoordsCenter,
    zoom: defaultZoom,
    behaviors: ['default', 'scrollZoom'],
  }, {
    // @ts-ignore
    searchControlProvider: 'yandex#search',
  }), [ymaps]);

  useEffect(() => {
    if (!map || !clusterer) {
      return;
    }

    map.geoObjects.removeAll();
    // @ts-ignore
    map.geoObjects.add(clusterer);

    if (!selectedId && map.getZoom() === defaultZoom) {
      map.setBounds(clusterer.getBounds(), {
        checkZoomRange: true,
      });
    }
  }, [map, clusterer, selectedId]);

  useEffect(() => {
    const selectedOrder = orders.find(order => order.id === selectedId);
    if (selectedOrder && ymaps && map) {
      map.setCenter([selectedOrder.coords.lat, selectedOrder.coords.long], selectedZoom);
      // @ts-ignore
      const selectedPlacemark: Placemark = clusterer.getGeoObjects().find((o: any) => o.properties._data.id === selectedId);
      if (selectedPlacemark) {
        // Если метка не попала в кластер и видна на карте, откроем ее балун.
        selectedPlacemark.balloon.open();
        selectedPlacemark.balloon.events.add('close', function (e) {
          searchParams.delete('orderId');
          setSearchParams(searchParams);
        });
      }
    }
  }, [ymaps, orders, map, selectedId]);

  const handleSelectedOrder = (selectedId: number) => {
    searchParams.set('orderId', selectedId.toString());
    setSearchParams(searchParams);
  };

  return (
    <>
      <div id="map"></div>
      <OrdersList selectedId={selectedId} orders={ordersWithClients} onSelect={handleSelectedOrder} />
    </>
  );
};

export default App;
