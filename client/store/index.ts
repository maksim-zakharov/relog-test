import {
    configureStore, ThunkDispatch, AnyAction,
} from '@reduxjs/toolkit';
import {TypedUseSelectorHook, useDispatch, useSelector} from 'react-redux';

import {reducer} from './reducer';
import { appApi } from '../pages/App/App.store';

export const store = configureStore(({
    reducer,
    devTools: process.env.NODE_ENV !== 'production',
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware()
            .concat(appApi.middleware),
}));

export type AppState = ReturnType<typeof reducer>;
export type AppDispatch = typeof store.dispatch;

export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector;
export const useAppDispatch: () => ThunkDispatch<AppState, void, AnyAction> = () => useDispatch<AppDispatch>();
