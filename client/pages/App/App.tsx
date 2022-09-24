import * as React from 'react';
import { useEffect, useMemo } from 'react';
import { useYMaps } from '../../hooks/useYMaps';
import './App.styles.less';
import * as YMaps from 'yandex-maps';
import { useGetClientsQuery, useGetOrdersQuery } from './App.store';
import { OrderViewItem } from './models';
import OrdersList from './OrdersList/OrdersList';
import { useSearchParams } from 'react-router-dom';

const App = () => {
  const locale = 'kz-KZ'; // 'ru-RU';
  const currency = 'KZT'; // 'RUB';

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
      balloonContentBody: `<div>` + order.client?.name + ' ' + new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
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
      preset: 'islands#violetIcon',
    };
  };

  const placeMarks = useMemo(() => {
    if (!ymaps) {
      return [];
    }

    return ordersWithClients.map((order, i) => {
      const placeMark = new ymaps.Placemark([order.coords.lat, order.coords.long], getPointData(order), getPointOptions(order));

      // Если метка не попала в кластер и видна на карте, откроем ее балун.
      placeMark.balloon.events.add('close', function(e) {
        // searchParams.delete('orderId');
        // setSearchParams(searchParams);

        placeMark.options.set({
          preset: 'islands#violetIcon',
        });
      });

      placeMark.events.add('click', () => {
        searchParams.set('orderId', order.id.toString());
        setSearchParams(searchParams);
      });

      return placeMark;
    });

  }, [ymaps, ordersWithClients]);

  const clusterer = useMemo(() => {

    if (!ymaps) {
      return undefined;
    }

    return new ymaps.Clusterer({
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
    clusterer?.remove(placeMarks);
    clusterer?.add(placeMarks);

    console.log('Render ChangePlaceMarks');
  }, [clusterer, placeMarks]);

  useEffect(() => {
    /**
     * В кластеризатор можно добавить javascript-массив меток (не геоколлекцию) или одну метку.
     * @see https://api.yandex.ru/maps/doc/jsapi/2.1/ref/reference/Clusterer.xml#add
     */

    // map.geoObjects.removeAll();
    if (map && !map.geoObjects.get(0)) {
      // @ts-ignore
      map.geoObjects.add(clusterer);
    }
  }, [map, clusterer]);

  useEffect(() => {
    if (map && clusterer.getGeoObjects().length) {
      // @ts-ignore
      const selectedPlacemark: Placemark = clusterer.getGeoObjects().find((o: any) => o.properties._data.id === selectedId);
      if (selectedPlacemark) {
        console.log('Render BalloonOpen');
        // map.panTo(selectedPlacemark.geometry._coordinates)
        //   .then(() => selectedPlacemark.balloon.open());
        map.setCenter(selectedPlacemark.geometry._coordinates, selectedZoom)
          .then(() => selectedPlacemark.balloon.open());
        selectedPlacemark.options.set({
          preset: 'islands#redStretchyIcon',
        });
      } else {
        map.setBounds(clusterer.getBounds(), {
          checkZoomRange: true,
        });
      }
    }
  }, [clusterer, map, selectedId]);

  const handleSelectedOrder = (selectedId: number) => {
    searchParams.set('orderId', selectedId.toString());
    setSearchParams(searchParams);
  };

  return (
    <>
      <div id="map"></div>
      <OrdersList currency={currency} locale={locale} selectedId={selectedId} orders={ordersWithClients}
                  onSelect={handleSelectedOrder} />
    </>
  );
};

export default App;
