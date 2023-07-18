import { configureStore } from '@reduxjs/toolkit'
import bpm from './Reducers/bpm'
import drumGroove from './Reducers/drumGroove';
import bassGroove from './Reducers/bassGroove';
import bassLine from './Reducers/bassLine';
import drumLine from './Reducers/drumLine';
import lamp from './Reducers/lamps';

const store = configureStore({
    reducer: {
        bpm: bpm.reducer,
        drumGroove: drumGroove.reducer,
        bassGroove: bassGroove.reducer,
        bassline: bassLine.reducer,
        drumLine: drumLine.reducer,
        lamp: lamp.reducer
    }
})

export default store;