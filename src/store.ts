import { configureStore } from '@reduxjs/toolkit'
import song from './Reducers/song';
import bpm from './Reducers/bpm'
import drumLine from './Reducers/drumLine';
import lamp from './Reducers/lamps';

const store = configureStore({
    reducer: {
        bpm: bpm.reducer,
        drumLine: drumLine.reducer,
        lamps: lamp.reducer,
        song: song.reducer
    }
})

export default store;