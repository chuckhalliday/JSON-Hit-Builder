import { configureStore } from '@reduxjs/toolkit'
import song from './Reducers/song';
import bpm from './Reducers/bpm'
import drumGroove from './Reducers/drumGroove';
import drumLine from './Reducers/drumLine';
import lamp from './Reducers/lamps';

const store = configureStore({
    reducer: {
        bpm: bpm.reducer,
        drumGroove: drumGroove.reducer,
        drumLine: drumLine.reducer,
        lamps: lamp.reducer,
        song: song.reducer
    }
})

export default store;