/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb', // signature images / logo uploads
    },
    // pdfkit (a @react-pdf/renderer dependency) requires its standard-font
    // files (.afm/.cjs) at runtime via a dynamically-built path, so Next's
    // build-time file tracing can't see the reference and drops them from
    // the Vercel serverless bundle — every PDF route then crashes with
    // "Cannot find module '.../standard-fonts/Helvetica.cjs'". Force them in.
    outputFileTracingIncludes: {
      '/**/*': ['./node_modules/pdfkit/js/**/*', './node_modules/@react-pdf/**/*'],
    },
  },
};

export default nextConfig;
