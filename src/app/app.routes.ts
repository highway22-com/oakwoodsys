import { Routes } from '@angular/router';
import { Bloq } from '../pages/bloq/bloq';
import { Post } from '../pages/post/post';
import { Home } from '../pages/home/home';

export const routes: Routes = [
    {
        path: '',
        component: Home
    },
    {
        path: 'bloq/:slug',
        component: Post
    }
];
