import config from './config/env';
import getApp from './app';
import { isCloudinaryConfigured, isPaymentSandboxMode } from './config/env';
import { isServiceRoleConfigured } from './config/supabase';
import { isOnepayConfigured, isPayhereConfigured } from './services/gateways';

const PORT = config.PORT;
const app = getApp();

app.listen(PORT, config.HOST, () => {
  console.log(`✓ Backend server running on http://${config.HOST}:${PORT}`);
  console.log(`✓ CORS allowed origins: ${config.CORS_ORIGINS.join(', ')}`);
  console.log(`✓ Environment: ${config.NODE_ENV}`);
  console.log(
    isServiceRoleConfigured()
      ? '✓ Supabase admin client: service role (RLS bypass for API writes)'
      : '✗ Supabase admin client: using anon key — set SUPABASE_SERVICE_ROLE_KEY'
  );
  if (config.PORTFOLIO_STORAGE === 'cloudinary') {
    console.log(
      isCloudinaryConfigured()
        ? `✓ Portfolio storage: Cloudinary (${config.CLOUDINARY_CLOUD_NAME})`
        : '✗ Cloudinary credentials missing in .env'
    );
  } else {
    console.log(`✓ Portfolio storage: Supabase bucket "${config.SUPABASE_BUCKET}"`);
  }
  console.log(isOnepayConfigured() ? '✓ OnePay configured' : '○ OnePay: simulate mode');
  console.log(isPayhereConfigured() ? '✓ PayHere configured' : '○ PayHere: simulate mode');
  console.log(
    isPaymentSandboxMode()
      ? '✓ Payments: SANDBOX mode'
      : '○ Payments: live gateway mode'
  );
});
