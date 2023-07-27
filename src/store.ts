import { configureStore } from '@reduxjs/toolkit'
import song from './Reducers/song';
import bpm from './Reducers/bpm'

const store = configureStore({
    reducer: {
        bpm: bpm.reducer,
        song: song.reducer
    }
})

export default store;