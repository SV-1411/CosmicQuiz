// Responsive design utilities and breakpoint management
export const BREAKPOINTS = {
  mobile: '(max-width: 640px)',
  tablet: '(min-width: 641px) and (max-width: 1024px)',
  desktop: '(min-width: 1025px)',
  largeDesktop: '(min-width: 1440px)'
}

export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState('desktop')
  
  useEffect(() => {
    const updateScreenSize = () => {
      if (window.matchMedia(BREAKPOINTS.mobile).matches) {
        setScreenSize('mobile')
      } else if (window.matchMedia(BREAKPOINTS.tablet).matches) {
        setScreenSize('tablet')
      } else {
        setScreenSize('desktop')
      }
    }
    
    updateScreenSize()
    window.addEventListener('resize', updateScreenSize)
    return () => window.removeEventListener('resize', updateScreenSize)
  }, [])
  
  return screenSize
}

// Dynamic grid configurations based on screen size
export const getGridConfig = (screenSize, totalItems) => {
  const configs = {
    mobile: {
      participants: { cols: 1, maxHeight: '60vh' },
      leaderboard: { cols: 1, maxHeight: '50vh' },
      questions: { cols: 1, maxHeight: '70vh' },
      sidebar: { width: 'full', position: 'top' }
    },
    tablet: {
      participants: { cols: 1, maxHeight: '50vh' },
      leaderboard: { cols: 1, maxHeight: '45vh' },
      questions: { cols: 2, maxHeight: '60vh' },
      sidebar: { width: '280px', position: 'left' }
    },
    desktop: {
      participants: { cols: 1, maxHeight: '400px' },
      leaderboard: { cols: 1, maxHeight: '500px' },
      questions: { cols: 3, maxHeight: '600px' },
      sidebar: { width: '320px', position: 'left' }
    }
  }
  
  return configs[screenSize] || configs.desktop
}

// Virtual scrolling for large lists
export const VirtualizedList = ({ items, renderItem, itemHeight = 60, containerHeight = 400 }) => {
  const [scrollTop, setScrollTop] = useState(0)
  const [containerRef, setContainerRef] = useState(null)
  
  const visibleStart = Math.floor(scrollTop / itemHeight)
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  )
  
  const visibleItems = items.slice(visibleStart, visibleEnd)
  const totalHeight = items.length * itemHeight
  const offsetY = visibleStart * itemHeight
  
  return (
    <div
      ref={setContainerRef}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.target.scrollTop)}
      className="scrollbar-thin scrollbar-thumb-purple-400 scrollbar-track-slate-700"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={visibleStart + index} style={{ height: itemHeight }}>
              {renderItem(item, visibleStart + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Responsive text sizing
export const getResponsiveTextSize = (screenSize, baseSize = 'text-base') => {
  const sizeMap = {
    mobile: {
      'text-xs': 'text-xs',
      'text-sm': 'text-xs',
      'text-base': 'text-sm',
      'text-lg': 'text-base',
      'text-xl': 'text-lg',
      'text-2xl': 'text-xl',
      'text-3xl': 'text-2xl',
      'text-4xl': 'text-3xl'
    },
    tablet: {
      'text-xs': 'text-xs',
      'text-sm': 'text-sm',
      'text-base': 'text-base',
      'text-lg': 'text-lg',
      'text-xl': 'text-xl',
      'text-2xl': 'text-xl',
      'text-3xl': 'text-2xl',
      'text-4xl': 'text-3xl'
    },
    desktop: {
      'text-xs': 'text-xs',
      'text-sm': 'text-sm',
      'text-base': 'text-base',
      'text-lg': 'text-lg',
      'text-xl': 'text-xl',
      'text-2xl': 'text-2xl',
      'text-3xl': 'text-3xl',
      'text-4xl': 'text-4xl'
    }
  }
  
  return sizeMap[screenSize]?.[baseSize] || baseSize
}
