import { Routes } from '@angular/router';

import { Structured } from '../pages/structured/structured';
import { StructuredOffer } from '../pages/structured-offer/structured-offer';
import { ContactUs } from '../pages/contact-us/contact-us';
import { ContactSuccess } from '../pages/contact-success/contact-success';
import { Login } from '../pages/login/login';


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
        path: 'structured-engagement',
        component: Structured
    },
    {
        path: 'structured-engagement/:slug',
        component: StructuredOffer
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
        path: 'contact-success',
        component: ContactSuccess
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
