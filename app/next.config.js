/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.seadn.io" },
      { protocol: "https", hostname: "ipfs.io" },
	  { protocol: "https", hostname: "freepik.com" },
      { protocol: "https", hostname: "gateway.pinata.cloud" },
      { protocol: "https", hostname: "**.pinata.cloud" },
      { protocol: "https", hostname: "nativibiza.com" }, // bạn vừa dùng domain này
    ],
  },
};
module.exports = nextConfig;
