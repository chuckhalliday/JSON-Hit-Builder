import { defaultPreset, getMidiRouting, PRESETS, presetOf, presetRouting, setMidiRouting } from './midiRouting';

describe('MIDI routing', () => {
  it('picks loopMIDI ports on Windows and IAC buses elsewhere', () => {
    expect(defaultPreset('Win32')).toBe('windows');
    expect(defaultPreset('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('windows');
    expect(defaultPreset('MacIntel')).toBe('mac');
    expect(PRESETS.mac.routing).toEqual({ drums: 'IAC Driver Bus 1', bass: 'IAC Driver Bus 2', chords: 'IAC Driver Bus 3' });
    expect(PRESETS.windows.routing.drums).toBe('loopMIDI Port 1');
  });

  it('names the preset a routing matches, or none once a port is picked by hand', () => {
    expect(presetOf(PRESETS.windows.routing)).toBe('windows');
    expect(presetOf({ ...PRESETS.mac.routing, bass: 'My Synth' })).toBeNull();
  });

  it('starts on the IAC buses, the routing playback always used, and takes changes', () => {
    expect(getMidiRouting()).toEqual(PRESETS.mac.routing);
    setMidiRouting({ ...PRESETS.windows.routing, chords: 'Keys' });
    expect(getMidiRouting()).toEqual({ drums: 'loopMIDI Port 1', bass: 'loopMIDI Port 2', chords: 'Keys' });
  });

  it('takes the VirMIDI ports found on Linux, whatever card they landed on', () => {
    expect(defaultPreset('Linux x86_64')).toBe('linux');
    expect(defaultPreset('X11; Linux x86_64')).toBe('linux');
    const outputs = ['Midi Through Port-0', 'VirMIDI 3-2', 'VirMIDI 3-0', 'VirMIDI 3-1', 'VirMIDI 3-3'];
    const routing = presetRouting('linux', outputs);
    expect(routing).toEqual({ drums: 'VirMIDI 3-0', bass: 'VirMIDI 3-1', chords: 'VirMIDI 3-2' });
    expect(presetOf(routing)).toBe('linux');
    // None loaded yet: the preset's names, shown as not found.
    expect(presetRouting('linux', ['Midi Through Port-0'])).toEqual(PRESETS.linux.routing);
    // Fixed-name presets ignore what's detected.
    expect(presetRouting('mac', outputs)).toEqual(PRESETS.mac.routing);
    // One port on every track isn't the preset.
    expect(presetOf({ drums: 'VirMIDI 3-0', bass: 'VirMIDI 3-0', chords: 'VirMIDI 3-0' })).toBeNull();
  });
});
