import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Image as CanvasImage, Text, Shape, Transformer } from 'react-konva';
import { fontCss } from '../../editor/document';
import { ornaments } from '../../editor/ornaments';

const clamp = (value, min, max) => Math.round(Math.max(min, Math.min(max, value)));

function useImage(src) {
  const [loaded, setLoaded] = useState(null);
  useEffect(() => {
    if (!src) return;
    const image = new Image();
    image.onload = () => setLoaded({ src, image });
    image.src = src;
    return () => { image.onload = null; };
  }, [src]);
  return loaded?.src === src ? loaded?.image : undefined;
}

function cover(image, width, height) {
  const ratio = Math.max(width / image.width, height / image.height);
  const cropWidth = width / ratio;
  const cropHeight = height / ratio;
  return { x: (image.width - cropWidth) / 2, y: (image.height - cropHeight) / 2, width: cropWidth, height: cropHeight };
}

function Background({ canvas }) {
  const image = useImage(canvas.background.type === 'image' ? canvas.background.value : null);
  const { width, height, background } = canvas;
  return (
    <>
      <Rect width={width} height={height} listening={false} fill={background.type === 'color' ? background.value : '#fffdf8'} />
      {image && <CanvasImage width={width} height={height} image={image} crop={cover(image, width, height)} listening={false} />}
    </>
  );
}

function drawShape(context, node) {
  const { width, height } = node.size();
  context.beginPath();
  if (node.getAttr('figure') === 'ellipse') {
    context.save();
    context.scale(width / 2, height / 2);
    context.arc(1, 1, 1, 0, Math.PI * 2);
    context.restore();
  } else if (node.getAttr('figure') === 'heart') {
    context.moveTo(width / 2, height);
    context.bezierCurveTo(width * -.49, height * .34, width * .18, height * -.34, width / 2, height * .22);
    context.bezierCurveTo(width * .82, height * -.34, width * 1.49, height * .34, width / 2, height);
  } else {
    for (let i = 0; i < 10; i++) {
      const angle = i * Math.PI / 5 - Math.PI / 2;
      const radius = i % 2 ? .42 : 1;
      const x = width / 2 + Math.cos(angle) * width / 2 * radius;
      const y = height / 2 + Math.sin(angle) * height / 2 * radius;
      if (i === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
  }
  context.closePath();
  context.fillStrokeShape(node);
}

function CanvasLayer({ layer, selected, onSelect, onUpdate, nodeRef, elapsed }) {
  const image = useImage(layer.type === 'image' ? layer.src : ornaments[layer.asset]);
  const { x, y, width, height, rotation, opacity, locked, animation } = layer;
  const editing = Boolean(onUpdate);
  const fraction = elapsed != null && animation && animation.type !== 'none'
    ? Math.max(0, Math.min(1, (elapsed - animation.delay) / Math.max(animation.duration, 1)))
    : 1;
  const props = {
    ref: selected ? nodeRef : undefined,
    x, y: y + (animation?.type === 'rise' ? (1 - fraction) * 65 : 0), width, rotation,
    opacity: opacity * fraction,
    listening: editing,
    draggable: editing && !locked,
    onClick: event => { event.cancelBubble = true; onSelect?.(layer.id); },
    onTap: event => { event.cancelBubble = true; onSelect?.(layer.id); },
    onDragStart: () => onSelect?.(layer.id),
    onDragEnd: ({ target }) => onUpdate(layer.id, { x: clamp(target.x(), -4000, 4000), y: clamp(target.y(), -4000, 4000) }),
    onTransformEnd: ({ target }) => {
      const sx = target.scaleX();
      const sy = target.scaleY();
      target.scaleX(1);
      target.scaleY(1);
      onUpdate(layer.id, {
        x: clamp(target.x(), -4000, 4000), y: clamp(target.y(), -4000, 4000),
        rotation: Math.round(target.rotation()) % 360,
        width: clamp(width * sx, 12, 4000),
        ...(layer.type === 'text' ? { fontSize: clamp(layer.fontSize * sy, 8, 360) } : { height: clamp(height * sy, 12, 4000) }),
      });
    },
  };

  if (layer.type === 'text') {
    return <Text {...props} text={layer.content} fontSize={layer.fontSize} fontFamily={fontCss[layer.fontFamily]} fill={layer.fill} align={layer.align} lineHeight={1.28} />;
  }
  if (layer.type === 'decoration' || layer.type === 'image') return <CanvasImage {...props} height={height} image={image} />;
  if (layer.shape === 'rect') return <Rect {...props} height={height} fill={layer.fill} cornerRadius={Math.min(width, height) * .09} />;
  return <Shape {...props} height={height} fill={layer.fill} figure={layer.shape} sceneFunc={drawShape} />;
}

export default function DesignCanvas({ document: design, scale, selected, onSelect, onUpdate, animate = false }) {
  const selectedNode = useRef(null);
  const transformer = useRef(null);
  const stage = useRef(null);
  const [elapsed, setElapsed] = useState(animate ? 0 : null);
  const { canvas, elements } = design;
  const selection = elements.find(layer => layer.id === selected && layer.visible && !layer.locked);

  useLayoutEffect(() => {
    transformer.current?.nodes(selection && selectedNode.current ? [selectedNode.current] : []);
    transformer.current?.getLayer().batchDraw();
  }, [selection, scale]);

  useEffect(() => {
    if (!animate) return;
    let frame;
    const start = performance.now();
    const duration = Math.max(0, ...elements.map(layer => Number(layer.animation?.delay || 0) + Number(layer.animation?.duration || 0)));
    function tick(now) {
      const progress = now - start;
      setElapsed(progress);
      if (progress < duration) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animate, elements]);

  useEffect(() => {
    const fonts = ['17px "Inter Variable"', '17px "Playfair Display Variable"', '17px "Noto Sans Sinhala"'];
    Promise.all(fonts.map(font => window.document.fonts.load(font, 'FeelCraft සිංහල')))
      .then(() => stage.current?.batchDraw()).catch(() => {});
  }, []);

  const clearSelection = event => {
    if (event.target === event.target.getStage()) onSelect?.(null);
  };

  return (
    <Stage ref={stage} width={canvas.width * scale} height={canvas.height * scale}
      onClick={clearSelection} onTap={clearSelection} aria-label="Design canvas">
      <Layer scaleX={scale} scaleY={scale}>
        <Background canvas={canvas} />
        {elements.filter(layer => layer.visible).map(layer => (
          <CanvasLayer key={layer.id} layer={layer} selected={selected === layer.id} nodeRef={selectedNode}
            onSelect={onSelect} onUpdate={onUpdate} elapsed={elapsed} />
        ))}
        {onUpdate && <Transformer ref={transformer} flipEnabled={false} keepRatio={false}
          anchorSize={Math.min(24, 8 / scale)} borderStroke="#963d59" anchorStroke="#963d59"
          boundBoxFunc={(previous, next) => Math.abs(next.width) < 12 * scale || Math.abs(next.height) < 8 * scale ? previous : next} />}
      </Layer>
    </Stage>
  );
}
