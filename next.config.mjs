/** @type {import('next').NextConfig} */
const nextConfig = {
  // Twilio webhooks POST form-encoded bodies; nothing special needed for App
  // Router route handlers, but we keep the config explicit for future tuning.
  experimental: {},
};

export default nextConfig;
