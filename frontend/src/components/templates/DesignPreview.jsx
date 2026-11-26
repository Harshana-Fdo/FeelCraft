import { motion, useReducedMotion } from 'framer-motion';
import Ornament from './Ornament';

export default function DesignPreview({ document, animate = false }) {
  const reduced = useReducedMotion();
  const { canvas, elements } = document;

  return (
    <div className="design-preview" style={{
      '--design-aspect': canvas.width / canvas.height,
      backgroundColor: canvas.background.value,
    }}>
      {elements.filter(element => element.visible).map(element => {
        const { id, type, x, y, width, height, rotation, opacity, animation } = element;
        const shouldAnimate = animate && !reduced && animation?.type === 'fade-in';
        const position = {
          '--design-x': `${x / canvas.width * 100}%`,
          '--design-y': `${y / canvas.height * 100}%`,
          '--design-width': `${width / canvas.width * 100}%`,
          '--design-height': height ? `${height / canvas.height * 100}%` : undefined,
          rotate: `${rotation}deg`, opacity,
        };

        if (type === 'decoration') {
          return <div key={id} className="design-element design-ornament" style={position}><Ornament name={element.asset} /></div>;
        }

        const Text = id === 'heading' ? motion.h2 : motion.p;
        return (
          <Text key={id} className={`design-element design-${id}`}
            initial={shouldAnimate ? { opacity: 0, y: 8 } : false}
            animate={{ opacity, y: 0 }}
            transition={shouldAnimate ? { duration: animation.duration / 1000, delay: animation.delay / 1000 } : { duration: 0 }}
            style={{
              ...position, color: element.fill, textAlign: element.align,
              fontFamily: element.fontFamily === 'Inter' ? 'var(--font-interface)' : 'var(--font-editorial)',
              '--design-font-size': `${element.fontSize / canvas.width * 100}cqw`,
            }}
          >{element.content}</Text>
        );
      })}
    </div>
  );
}
