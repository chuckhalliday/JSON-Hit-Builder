import { configureStore } from '@reduxjs/toolkit'
import song from './reducers';

const store = configureStore({
    reducer: {
        song: song.reducer
    }
})

export default store;