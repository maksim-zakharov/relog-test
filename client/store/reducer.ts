import { combineReducers } from '@reduxjs/toolkit';
import { appApi } from '../pages/App/App.store';

export const reducer = combineReducers({
    [appApi.reducerPath]: appApi.reducer,
});
