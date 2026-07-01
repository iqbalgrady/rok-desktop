import { createConfiguredWebAPIs } from './runtimeConfig';
import type { RuntimeAPIs } from '@rok-desktop/ui/lib/api/types';
import '@rok-desktop/ui/index.css';
import '@rok-desktop/ui/styles/fonts';

declare global {
  interface Window {
    __ROK_DESKTOP_RUNTIME_APIS__?: RuntimeAPIs;
  }
}

window.__ROK_DESKTOP_RUNTIME_APIS__ = createConfiguredWebAPIs();

void import('@rok-desktop/ui/apps/renderElectronMiniChatApp')
  .then(({ renderElectronMiniChatApp }) => {
    renderElectronMiniChatApp(window.__ROK_DESKTOP_RUNTIME_APIS__ ?? createConfiguredWebAPIs());
  });
