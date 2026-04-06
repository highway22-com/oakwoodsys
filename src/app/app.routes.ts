import { Routes } from '@angular/router';

import { Structured } from '../pages/structured/structured';
import { StructuredOffer } from '../pages/structured-offer/structured-offer';
import { ContactUs } from '../pages/contact-us/contact-us';
import { ContactSuccess } from '../pages/contact-success/contact-success';
import { Login } from '../pages/login/login';
import { MainLayout } from '../layout/main-layout/main-layout';

export const routes: Routes = [
    {
        path: 'edit',
        loadComponent: () => import('../pages/edit-dashboard/edit-dashboard')
    },
    {
        path: 'edit/:slug',
        loadComponent: () => import('../pages/edit-page/edit-page')
    },
    {
        path: '',
        component: MainLayout,
        children: [
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
                loadComponent: () => import('../pages/blogs/blogs'),
                data: { isBlogs: true },
                title: 'IT Blog'
            },
            {
                path: 'services/:slug',
                loadComponent: () => import('../pages/services/services')
            },
            {
                path: 'services',
                redirectTo: '/services/data-ai-solutions',
                pathMatch: 'full'
            },
            {
                path: 'resources/case-studies/:slug',
                loadComponent: () => import('../pages/post/post')
            },
            {
                path: 'resources/case-studies',
                loadComponent: () => import('../pages/blogs/blogs'),
                data: { isBlogs: false },
                title: 'Case Studies'
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
                path: 'resources/structured-engagements',
                component: Structured
            },
            {
                path: 'structured-engagement/:slug',
                component: StructuredOffer
            },
            {
                path: 'events',
                redirectTo: '/',
                pathMatch: 'full',
            },
            {
                path: 'about',
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
                path: 'careers',
                loadComponent: () => import('../pages/carrers/carrers')
            },
            {
                path: 'privacy-policy',
                loadComponent: () => import('../pages/privacyAndPolicy/privacyAndPolicy')
            },
            {
                path: '404',
                loadComponent: () => import('../pages/page404/page404')
            },
            {
                path: '**',
                loadComponent: () => import('../pages/page404/page404')
            }
        ]
    }
];
