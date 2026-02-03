import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Partners from './pages/Partners';
import PartnerForm from './pages/PartnerForm';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import Deals from './pages/Deals';
import DealDetail from './pages/DealDetail';
import Financials from './pages/Financials';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="partners" element={<Partners />} />
          <Route path="partners/new" element={<PartnerForm />} />
          <Route path="partners/:id" element={<PartnerForm />} />
          <Route path="products" element={<Products />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id" element={<ProductForm />} />
          <Route path="leads" element={<Leads />} />
          <Route path="leads/:id" element={<LeadDetail />} />
          <Route path="deals" element={<Deals />} />
          <Route path="deals/:id" element={<DealDetail />} />
          <Route path="financials" element={<Financials />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
