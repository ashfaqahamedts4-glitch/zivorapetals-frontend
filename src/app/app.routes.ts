import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { ShopComponent } from './pages/shop/shop.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { CheckoutComponent } from './pages/checkout/checkout.component';
import { AdminLoginComponent } from './pages/admin/login/admin-login.component';
import { AdminLayoutComponent } from './pages/admin/layout/admin-layout.component';
import { CustomerLoginComponent } from './pages/customer/login/customer-login.component';
import { CustomerOrdersComponent } from './pages/customer/orders/customer-orders.component';
import { CustomerProfileComponent } from './pages/customer/profile/customer-profile.component';
import { CustomerWishlistComponent } from './pages/customer/wishlist/customer-wishlist.component';
import { customerAuthGuard } from './services/customer-auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'shop', component: ShopComponent },
  { path: 'product/:slug', component: ProductDetailComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: 'login', component: CustomerLoginComponent },
  { path: 'customer/login', redirectTo: 'login', pathMatch: 'full' },
  { path: 'customer/orders', component: CustomerOrdersComponent, canActivate: [customerAuthGuard] },
  { path: 'customer/profile', component: CustomerProfileComponent, canActivate: [customerAuthGuard] },
  { path: 'customer/wishlist', component: CustomerWishlistComponent, canActivate: [customerAuthGuard] },
  { path: 'admin', redirectTo: 'admin/dashboard', pathMatch: 'full' },
  { path: 'admin/login', redirectTo: 'login', pathMatch: 'full' },
  { path: 'admin/dashboard', component: AdminLayoutComponent },
  { path: '**', redirectTo: '' },
];
