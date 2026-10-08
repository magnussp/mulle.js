# mulle.js

Mulle.js is an attempt to recreate a wonderful game from the past and bring it to modern platforms, and fix some issues along the way.

You need to own the original release of Mulle Meck Bygger Bilar to use Mulle.js.

## Docker
The easiest way to build and run the game is with Docker Compose. The image extracts the game from the ISO, builds all assets and serves the game with Apache.

### Game files
Put the ISO of the game and `plugin.exe` (the plugin with extra parts and the crane game) in the `iso` folder:
```
iso/mullebil_sv.iso
iso/plugin.exe
```
The ISO must be named `mullebil_<language>.iso`. Supported languages are `sv`, `no`, `da`, `fi` and `nl`.

The build script can fetch both files from archive.org for you, it only needs `requests` and `pyyaml`:
```
pip3 install requests pyyaml
python3 build_scripts/build.py sv download-only
```

### Build and run
```
docker compose up --build
```
The game is then available at http://localhost:8080/.

The first build takes a while since all assets are extracted and converted. Later builds reuse the Docker cache unless the build scripts or the game files change.

### Settings
Settings are given as environment variables or in a `.env` file next to `docker-compose.yml`:

| Variable    | Default | Description                                                      |
|-------------|---------|------------------------------------------------------------------|
| `GAME_LANG` | `sv`    | Game language, selects `mullebil_<language>.iso`                 |
| `ISO_DIR`   | `./iso` | Folder with the ISO and `plugin.exe`, can be outside the project |
| `WEB_PORT`  | `8080`  | Port for the game on the host                                    |

Example, the Norwegian version with the ISO in another folder:
```
GAME_LANG=no ISO_DIR=~/Downloads/mulle docker compose up --build
```

### Without Compose
```
docker build -t mulle-js --build-arg GAME_LANG=sv .
docker run -p 8080:80 mulle-js
```

## Linux
Install dependencies
* **Arch Linux:** `sudo pacman -S python python-pip ffmpeg imagemagick nodejs npm`
* **Debian/Ubuntu:** `sudo apt install python3 python3-pip ffmpeg imagemagick nodejs npm optipng`

Python
`sudo pip3 install -r requirements.txt`

Extract assets
```
python3 extract_iso.py [path to iso]
```

You can then generate and start the Mulle.js website, and access it at http://localhost:8080/
```
npm install
npm run build
npm start
```

## Windows
Install dependencies  
Download and install Python3 from https://www.python.org/downloads/  
Download and install imagemagick from https://www.imagemagick.org/script/download.php choose ffmpeg as option during installation

`pip3 install PyTexturePacker pydub bitstring`

Mount Mulle Meck Bygger Bilar ISO  
`python3 extract.py <mounted dir>`

You can then generate and start the Mulle.js website, and access it at http://localhost:8080/
```
npm install
npm run build
npm start
```
[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)
