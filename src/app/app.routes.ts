import { Routes } from '@angular/router';
import { ContactUs } from '../pages/contact-us/contact-us';
import { Login } from '../pages/login/login';
import Home from '../pages/home/home';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('../pages/home/home')
    },
    {
        path: 'home',
        loadComponent: () => import('../pages/home/home')
    },
    {
        path: 'blog/:slug',
        loadComponent: () => import('../pages/post/post')
    },
    {
        path: 'blog',
        loadComponent: () => import('../pages/blogs/blogs')
    },
    {
        path: 'services/:slug',
        loadComponent: () => import('../pages/services/services')
    },
    {
        path: 'services',
        redirectTo: '/services/data-and-ai',
        pathMatch: 'full'
    },
    {
        path: 'resources/case-studies/:slug',
        loadComponent: () => import('../pages/post/post')
    },
    {
        path: 'resources/case-studies',
        loadComponent: () => import('../pages/resources/resources-wordpress')
    },
    {
        path: 'resources',
        loadComponent: () => import('../pages/resources/resources-wordpress')
    },
    {
        path: 'industries/:slug',
        loadComponent: () => import('../pages/industries/industries')
    },
    {
        path: 'industries',
        redirectTo: '/industries/healthcare',
        pathMatch: 'full'
    },
    {
        path: 'structured',
        loadComponent: () => import('../pages/structured/structured')
    },
    {
        path: 'about-us',
        loadComponent: () => import('../pages/about-us/about-us')
    },
    {
        path: 'contact-us',
        component: ContactUs
    },
    {
        path: 'admin/login',
        component: Login
    },
    {
        path: '**',
        redirectTo: '/'
    }
];
