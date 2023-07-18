import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface LampState {
  lampVerse: Array<{ index: number; checked: boolean }>;
  lampChorus: Array<{ index: number; checked: boolean }>;
  lampBridge: Array<{ index: number; checked: boolean }>;
}

const initialState: LampState = {
  lampVerse: [],
  lampChorus: [],
  lampBridge: [],
};

const lamp = createSlice({
    name: "Lamp",
    initialState,
    reducers: {
      setlampVerse: (state, action: PayloadAction<{ index: number; checked: boolean }[]>) => {
        console.log(action);
        state.lampVerse = action.payload;
      },
      setlampChorus: (state, action: PayloadAction<{ index: number; checked: boolean }[]>) => {
        console.log(action);
        state.lampChorus = action.payload;
      },
      setlampBridge: (state, action: PayloadAction<{ index: number; checked: boolean }[]>) => {
        console.log(action);
        state.lampBridge = action.payload;
      },
    },
  });

export const { setlampVerse, setlampChorus, setlampBridge } = lamp.actions;
export default lamp;