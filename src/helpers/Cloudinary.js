// This is a helper module which exports cloudinary methods wrapped in `teepee-cloudinary` npm.

import CloudinaryHelper from 'teepee-cloudinary'

const Cloudinary = ({ ApplicationConfig: Config }) => {
  return CloudinaryHelper(Config.cloudinary)
}

export default Cloudinary
