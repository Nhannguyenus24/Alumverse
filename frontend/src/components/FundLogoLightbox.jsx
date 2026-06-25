import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';

const FundLogoLightbox = ({ open, onClose, slides }) => (
  <Lightbox
    open={open}
    close={onClose}
    slides={slides}
    plugins={[Zoom]}
    zoom={{ scrollToZoom: true }}
    carousel={{ finite: true }}
    render={{
      buttonPrev: () => null,
      buttonNext: () => null,
    }}
    controller={{ closeOnBackdropClick: true }}
  />
);

export default FundLogoLightbox;
