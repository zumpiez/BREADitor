import { getTXTyFromMouse } from '../Tools';
import { selectLayer } from '../js/ui/LayersPalette';
import { setTileSelectorUI } from '../TileSelector';

import { getNormalEntityVisibility, selectEntityByIndex, scrollEntityPalletteToEntity } from '../js/ui/EntityPalette';

const $ = require('jquery');

const checkEntities = (ents, layer, map, click) => {
  const tileSize = layer ? map.vspData[layer.vsp].tilesize : map.vspData['default'].tilesize;

  for (let i = ents.length - 1; i >= 0; i--) {
    if (determineCollision(ents[i], click, tileSize)) {
      return {
        type: 'ENTITY',
        layerName: layer ? layer.name : 'E',
        layer: layer,
        ent: ents[i],
        eIdx: map.mapData.entities.indexOf(ents[i]) // todo man, map.mapData.entities vs map.entities is rough...
      };
    }
  }

  return false;
};

const checkTiles = (map, layer, click) => {
  const tX = click[0];
  const tY = click[1];
  const lIdx = map.layers.indexOf(layer);

  const tIdx = map.getTile(tX, tY, lIdx);

  if (tIdx) {
    return {
      type: 'TILE',
      tIdx: tIdx,
      layer: layer
    };
  }

  return false;
};

const isInRectangle = (px, py, rx, ry, rw, rh) => {
  return rx <= px && px <= rx + rw && ry <= py && py <= ry + rh;
};

const determineCollision = (ent, clickSet, tileSize) => {
  let px = null;
  let py = null;

  if ($.isNumeric(ent.location.px) && $.isNumeric(ent.location.py)) {
    px = ent.location.px;
    py = ent.location.py;
  } else if ($.isNumeric(ent.location.tx) && $.isNumeric(ent.location.ty)) {
    px = ent.location.tx * tileSize.width;
    py = ent.location.ty * tileSize.height;
  } else {
    throw new Error('Entity has invalid location information', ent);
  }

  if (ent.filename.endsWith('.chr')) { // TODO this is super hax.  Remove when everything is JSON
    const w = 16;
    const h = 32;
    py -= 16;

    return isInRectangle(clickSet[2], clickSet[3], px, py, w, h);
  }

  return false;
};

const seekResultFromLayers = (map, clickSet) => {
  const stack = JSON.parse(JSON.stringify(map.layerRenderOrder));
  let ret = null;

  while (stack.length) {
    const layerCode = stack.pop();

    if (layerCode === 'R') {
      continue;
    }
    if (layerCode === 'E') {
      if (map.entities['Entity Layer (E)'] && getNormalEntityVisibility()) {
        ret = checkEntities(map.entities['Entity Layer (E)'], null, map, clickSet);

        if (ret) {
          return ret;
        }
      }

      continue;
    }
    if ($.isNumeric(layerCode)) {
      const layer = map.getLayerByRStringCode(layerCode);

      if (map.entities[layer.name]) {
        ret = checkEntities(map.entities[layer.name], layer, map, clickSet);

        if (ret) {
          return ret;
        }
      }

      ret = checkTiles(map, layer, clickSet);

      if (ret) {
        return ret;
      }

      continue;
    }

    throw new Error('Unknown rstring layercode: ' + layerCode);
  }
};

export default () => {
  return {
    'mousedown': function (map, e) {
      console.log('EYEDROPPER->mousedown...');

      if (!(e.button === 0)) {
        console.log("Unknown eyedropper button: we know left/right (0/2), got: '" + e.button + "'.");
        return;
      }

      // let tIdx = null;
      // let eIdx = null;
      // let zIdx = -1;

      const clickSet = getTXTyFromMouse(map, e);
      // const tX = clickSet[0];
      // const tY = clickSet[1];

      // TODO if Zones are visible, check zone first.
      // TODO if Obs are visible, check obs next.

      const ret = seekResultFromLayers(map, clickSet);

      if (ret) {
        if (ret.type === 'TILE') {
          selectLayer(ret.layer.name);
          setTileSelectorUI('#left-palette', ret.tIdx, map, 0, ret.layer.vsp);
          return;
        }

        if (ret.type === 'ENTITY') {
          selectLayer(ret.layerName);
          window.$$$toggle_pallete('entity', true);
          selectEntityByIndex(ret.eIdx);
          scrollEntityPalletteToEntity(ret.eIdx);

          debugger;
          //selectLayer(ret.layer.name);
          //setTileSelectorUI('#left-palette', ret.tIdx, map, 0, ret.layer.vsp);
          return;
        }
        debugger;
      }

      debugger;


      debugger;

      // // TODO: using a valid integer as a sentinel is stupid. using sentinels is stupid. you're stupid, grue.
      // if (getSelectedLayer().map_tileData_idx > 900) {
      //   switch (getSelectedLayer().map_tileData_idx) {
      //     case 999:
      //       zIdx = map.getZone(tX, tY);
      //       console.log('ZONES!: ' + zIdx);
      //       setActiveZone(zIdx);

      //       scrollZonePalletteToZone(zIdx);

      //       return;
      //     case 998:
      //       console.log('OBS!');
      //       doVSPselector(tX, tY, map);
      //       tIdx = map.getTile(tX, tY, getSelectedLayer().map_tileData_idx);
      //       break;
      //     default:
      //       throw new Error('SOMETHING IS TERRIBLYH WRONG WITH A TERLKNDSHBLE SENTINEL AND GRUE IS A BAD MAN');
      //   }
      // } else {
      //   // TODO seriously branching code here is not a good idea for complexity reasons.  rework later?
      //   if (map.mapData.isTileSelectorMap) {
      //     tIdx = map.getTile(tX, tY, 0);
      //     doVSPselector(tX, tY, map);
      //   } else {
      //     tIdx = map.getTile(tX, tY, getSelectedLayer().map_tileData_idx);
      //     doVSPselector(tX, tY, map);
      //   }
      // }

      // setTileSelectorUI('#left-palette', tIdx, map, 0, getSelectedLayer().layer.vsp);
    },
    'button_element': '#btn-tool-smart-eyedropper',
    'human_name': 'iDrop +'
  };
};