import { Routes } from '@angular/router';
import { Bloq } from '../pages/bloq/bloq';
import { Post } from '../pages/post/post';
import { Home } from '../pages/home/home';
import { Services } from '../pages/services/services';
import { Resources } from '../pages/resources/resources';
import { Industries } from '../pages/industries/industries';
import { Blog } from '../pages/blog/blog';
import { Structured } from '../pages/structured/structured';
import { AboutUs } from '../pages/about-us/about-us';
import { ContactUs } from '../pages/contact-us/contact-us';

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
        component: Resources
    },
    {
        path: 'resources/case-studies',
        component: Resources
    },
    {
        path: 'resources',
        component: Resources
    },
    {
        path: 'industries/:slug',
        component: Industries
    },
    {
        path: 'industries',
        component: Industries
    },
    {
        path: 'bloq',
        component: Bloq
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
    }
];
