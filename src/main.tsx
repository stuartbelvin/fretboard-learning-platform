import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Theme } from '@radix-ui/themes'
import { ColorProvider, useColorPalette } from './context'
import { AppRouter } from './router'
import '@radix-ui/themes/styles.css'
import './index.css'

/**
 * ThemedApp wraps the app with Radix Theme that responds to color palette changes
 */
function ThemedApp() {
  const { radixAccentColor } = useColorPalette();
  
  return (
    <Theme 
      appearance="dark" 
      accentColor={radixAccentColor} 
      grayColor="slate" 
      radius="medium" 
      scaling="100%"
    >
      <AppRouter />
    </Theme>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ColorProvider>
      <ThemedApp />
    </ColorProvider>
  </StrictMode>,
)
