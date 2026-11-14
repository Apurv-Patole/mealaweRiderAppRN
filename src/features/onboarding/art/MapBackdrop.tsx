import { MAP_PLACEMENT } from './heroLayout';
import { SvgAsset } from './HeroStage';
import {
  mapDottedPathSvg,
  mapHaloSvg,
  mapRoadASvg,
  mapRoadBSvg,
  mapRoadCSvg,
  mapRoadDSvg,
  mapRoadESvg,
} from './svgSources';

/** The mint "map" behind every slide: roads, a soft halo and a dotted route. Draw order follows the Figma layers. */
export function MapBackdrop() {
  return (
    <>
      <SvgAsset roads xml={mapDottedPathSvg} rect={MAP_PLACEMENT.dottedPath} />
      <SvgAsset roads xml={mapRoadASvg} rect={MAP_PLACEMENT.roadA} />
      <SvgAsset roads xml={mapRoadBSvg} rect={MAP_PLACEMENT.roadB} />
      <SvgAsset roads xml={mapRoadCSvg} rect={MAP_PLACEMENT.roadC} />
      <SvgAsset roads xml={mapRoadDSvg} rect={MAP_PLACEMENT.roadD} />
      <SvgAsset roads xml={mapRoadESvg} rect={MAP_PLACEMENT.roadE} />
      <SvgAsset roads xml={mapHaloSvg} rect={MAP_PLACEMENT.halo} />
    </>
  );
}
