import { useState, useEffect } from 'react';
import { renderPage, renderPageBlocks, useActiveDevices } from 'editor-core/renderer';
import PreviewChrome from '../../src/editor/PreviewChrome.jsx';

function makeHostBlock(loader, fallbackTitle) {
  return function HostBlock(props) {
    const [Real, setReal] = useState(null);
    useEffect(() => {
      let cancelled = false;
      loader()
        .then((mod) => { if (!cancelled) setReal(() => mod.default); })
        .catch((err) => console.error(`[${fallbackTitle} block] load failed:`, err));
      return () => { cancelled = true; };
    }, []);
    if (!Real) {
      return (
        <div style={{ padding: 24, border: '1px dashed #c7d2fe', borderRadius: 8, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
          Loading {fallbackTitle}…
        </div>
      );
    }
    return <Real {...props} />;
  };
}

const HostProductsCarousel = makeHostBlock(() => import('@host/components/catalog/ProductsCarousel'), 'Products Carousel');
const HostNewsletterForm = makeHostBlock(() => import('@host/components/layout/NewsletterForm'), 'Newsletter Form');

const previewBlocks = {
  ProductsCarousel: HostProductsCarousel,
  NewsletterForm: HostNewsletterForm,
};

export default function PreviewFramePage() {
  const [pageData, setPageData] = useState(null);
  const [footerData, setFooterData] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const devices = useActiveDevices();

  useEffect(() => {
    const onMessage = (e) => {
      const msg = e.data;
      if (!msg || typeof msg !== 'object') return;
      if (msg.type === 'pageData') {
        setPageData(msg.pageData);
        if ('footerData' in msg) setFooterData(msg.footerData);
        if ('selectedId' in msg) setSelectedId(msg.selectedId);
        if ('hoveredId' in msg) setHoveredId(msg.hoveredId);
      }
    };
    window.addEventListener('message', onMessage);
    try {
      window.parent?.postMessage({ type: 'frame-ready' }, '*');
    } catch {}
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const handleSelect = (id) => {
    setSelectedId(id);
    try {
      window.parent?.postMessage({ type: 'select', id }, '*');
    } catch {}
  };

  const handleDelete = (id) => {
    try {
      window.parent?.postMessage({ type: 'delete', id }, '*');
    } catch {}
  };

  const handleDuplicate = (id) => {
    try {
      window.parent?.postMessage({ type: 'duplicate', id }, '*');
    } catch {}
  };

  const handleUpdateProp = (id, key, value) => {
    try {
      window.parent?.postMessage({ type: 'updateProp', id, key, value }, '*');
    } catch {}
  };

  if (!pageData) {
    return (
      <div style={{ padding: 40, color: '#94a3b8', textAlign: 'center', fontSize: 13 }}>
        Loading preview…
      </div>
    );
  }

  return (
    <PreviewChrome
      pagePath={pageData?.path}
      footerContent={footerData ? renderPageBlocks(footerData, {
        onSelect: handleSelect,
        onDelete: handleDelete,
        onDuplicate: handleDuplicate,
        onUpdateProp: handleUpdateProp,
        selectedId,
        hoveredId,
        devices,
        blocks: previewBlocks,
        editingTarget: 'footer',
      }) : null}
    >
      <main>
        {renderPage(pageData, {
          onSelect: handleSelect,
          onDelete: handleDelete,
          onDuplicate: handleDuplicate,
          onUpdateProp: handleUpdateProp,
          selectedId,
          hoveredId,
          devices,
          blocks: previewBlocks,
          editingTarget: 'page',
        })}
      </main>
    </PreviewChrome>
  );
}
