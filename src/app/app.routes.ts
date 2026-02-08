import { Routes } from '@angular/router';
import { Blogs } from '../pages/blogs/blogs';
import { Post } from '../pages/post/post';
import { Home } from '../pages/home/home';
import { Services } from '../pages/services/services';
import { Resources as ResourcesList } from '../pages/resources/resources-wordpress';
import { Industries } from '../pages/industries/industries';
import { Structured } from '../pages/structured/structured';
import { AboutUs } from '../pages/about-us/about-us';
import { ContactUs } from '../pages/contact-us/contact-us';
import { Login } from '../pages/login/login';

export const routes: Routes = [
    {
        path: '',
        component: Home
    },
    {
        path: 'home',
        redirectTo: '',
        pathMatch: 'full'
    },
    {
        path: 'blog/:slug',
        component: Post
    },
    {
        path: 'blog',
        component: Blogs
    },
    {
        path: 'services/:slug',
        component: Services
    },
    {
        path: 'services',
        redirectTo: '/services/data-and-ai',
        pathMatch: 'full'
    },
    {
        path: 'resources/case-studies/:slug',
        component: Post
    },
    {
        path: 'resources/case-studies',
        component: ResourcesList
    },
    {
        path: 'resources',
        component: ResourcesList
    },
    {
        path: 'industries/:slug',
        component: Industries
    },
    {
        path: 'industries',
        redirectTo: '/industries/healthcare',
        pathMatch: 'full'
    },
    {
        path: 'structured',
        component: Structured
    },
    {
        path: 'about-us',
        component: AboutUs
    },
    {
        path: 'contact-us',
        component: ContactUs
    },
    {
        path: 'admin/login',
        component: Login
    }
];
