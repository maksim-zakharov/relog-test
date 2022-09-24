import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import { Order } from './models';

export const arrayQueryProps = <T>(type: any, selector: (v: T) => any = v => v): any => ({
    providesTags: (result: ({ type: any } & T)[]) =>
      result
        ? [...result.map((v: any) => ({type, id: selector(v)})), type]
        : [type]
})

export const appApi = createApi({
    reducerPath: 'appApi',
    tagTypes: ['Client', 'Order'],
    baseQuery: fetchBaseQuery({
        baseUrl: '/api',
    }),
    endpoints: (builder) => ({
        getClients: builder.query<any[], any>({
            query: (params) => '/clients',
            ...arrayQueryProps<any>('Client', v => v.id)
        }),
        getOrders: builder.query<Order[], any>({
            query: () => `/orders`,
            ...arrayQueryProps<any>('Order', v => v.id)
        })
    }),
});

export const {useGetClientsQuery, useGetOrdersQuery
} = appApi;
