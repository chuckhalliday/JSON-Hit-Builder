import { configureStore } from '@reduxjs/toolkit'
import bpm from './Reducers/bpm'

const store = configureStore({
    reducer: {
        bpm: bpm.reducer
    }
})

export default store;