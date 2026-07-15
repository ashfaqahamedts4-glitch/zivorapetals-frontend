import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { ShopComponent } from './pages/shop/shop.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { CheckoutComponent } from './pages/checkout/checkout.component';
import { AdminLoginComponent } from './pages/admin/login/admin-login.component';
import { AdminLayoutComponent } from './pages/admin/layout/admin-layout.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'shop', component: ShopComponent },
  { path: 'product/:slug', component: ProductDetailComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: 'admin', redirectTo: 'admin/login', pathMatch: 'full' },
  { path: 'admin/login', component: AdminLoginComponent },
  { path: 'admin/dashboard', component: AdminLayoutComponent },
  { path: '**', redirectTo: '' },
];
