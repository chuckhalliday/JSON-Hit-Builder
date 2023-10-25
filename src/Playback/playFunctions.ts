export function wait(time: number) {
  return new Promise(resolve => setTimeout(resolve, time * 1000));
}

export async function triggerMidi(bus: string, note: number, duration: number, velocity: number, release: number) {
  try {
    const access = await navigator.requestMIDIAccess();
    const outputs = access.outputs.values();
    let outputDevice: WebMidi.MIDIOutput | null = null;
    for (const output of outputs) {
      if (output.name === `IAC Driver Bus ${bus}`) {
        outputDevice = output;
        break;
      }
    }

    if (!outputDevice) {
      console.log("Output device 'IAC Driver Bus 1' not found.");
      return;
    }

    const startMessage = [0x90, note, velocity];
    const stopMessage = [0x80 , note, release]
    outputDevice.send(startMessage);
    await wait(duration);
    outputDevice.send(stopMessage)
  } catch (error) {
    console.log("MIDI access request failed:", error);
  }
}