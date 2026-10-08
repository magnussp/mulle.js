"""
Read the score (VWSC) and markers (VWLB) of Director 5/6 movies extracted by drxtract
"""
import glob
import os
import struct

MAIN_CHANNELS_SIZE = 144
SPRITE_SIZE = 24


def _chunk(extract_folder: str, chunk_type: str) -> bytes:
    files = glob.glob(os.path.join(extract_folder, 'bin', '*.' + chunk_type))
    if not files:
        raise FileNotFoundError('No %s chunk in %s' % (chunk_type, extract_folder))
    with open(files[0], 'rb') as fp:
        return fp.read()


def markers(extract_folder: str) -> dict:
    """
    Get markers of a movie
    :param extract_folder: drxtract output folder
    :return: Marker name as key and frame number as value
    """
    data = _chunk(extract_folder, 'VWLB')
    count = struct.unpack('>H', data[:2])[0]
    entries = [struct.unpack('>HH', data[2 + i * 4:6 + i * 4]) for i in range(count)]
    text_length = struct.unpack('>I', data[2 + count * 4:6 + count * 4])[0]
    text = data[6 + count * 4:6 + count * 4 + text_length]

    out = {}
    for i, (frame, offset) in enumerate(entries):
        end = entries[i + 1][1] if i + 1 < count else text_length
        out[text[offset:end].decode('iso8859-1')] = frame
    return out


def _frame_buffers(data: bytes) -> list:
    """
    Decode the delta compressed frame data
    """
    list_size = struct.unpack('>i', data[16:20])[0]
    offsets = struct.unpack('>%di' % list_size, data[24:24 + 4 * list_size])
    base = 24 + 4 * list_size
    frame_data = data[base + offsets[0]:base + offsets[1]]

    channels = struct.unpack('>H', frame_data[16:18])[0]
    buffer = bytearray(channels * SPRITE_SIZE)
    frames = []
    pos = 20
    while pos < len(frame_data):
        size = struct.unpack('>H', frame_data[pos:pos + 2])[0]
        if size == 0:
            break
        end = pos + size
        pos += 2
        while pos < end:
            channel_size, channel_offset = struct.unpack('>HH', frame_data[pos:pos + 4])
            pos += 4
            buffer[channel_offset:channel_offset + channel_size] = frame_data[pos:pos + channel_size]
            pos += channel_size
        frames.append(bytes(buffer))
    return frames


def frames(extract_folder: str, sprite_channels: int = 48) -> list:
    """
    Get frames of a movie
    :param extract_folder: drxtract output folder
    :param sprite_channels: Number of sprite channels to include
    :return: List of frames with script, tempo and sprites
    """
    out = []
    for buffer in _frame_buffers(_chunk(extract_folder, 'VWSC')):
        script_lib, script_member = struct.unpack('>HH', buffer[0:4])
        tempo = struct.unpack('>H', buffer[28:30])[0]
        sound_lib, sound_member = struct.unpack('>HH', buffer[96:100])

        sprites = {}
        for channel in range(1, sprite_channels + 1):
            record = buffer[MAIN_CHANNELS_SIZE + (channel - 1) * SPRITE_SIZE:MAIN_CHANNELS_SIZE + channel * SPRITE_SIZE]
            sprite_type, ink, fore_color, back_color, lib, member = struct.unpack('>BBBBHH', record[:8])
            if not member:
                continue
            y, x, height, width = struct.unpack('>hhHH', record[12:20])
            sprites[channel] = {'lib': lib, 'member': member, 'x': x, 'y': y, 'width': width, 'height': height,
                                'ink': ink & 0x3f, 'foreColor': fore_color}

        out.append({'script': [script_lib, script_member] if script_member else None,
                    'tempo': tempo,
                    'sound': [sound_lib, sound_member] if sound_member else None,
                    'sprites': sprites})
    return out
