import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { Apollo, gql } from 'apollo-angular';

@Component({
  selector: 'app-bloq',
  imports: [RouterLink, CommonModule, DatePipe],
  templateUrl: './bloq.html',
  styleUrl: './bloq.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Bloq implements OnInit {
  private readonly apollo = inject(Apollo);
  readonly posts = signal<any>(null);
  readonly loading = signal(true);
  readonly error = signal<any>(null);

  ngOnInit() {
    this.apollo
      .watchQuery({
        query: gql`
         query post {
            posts {
              nodes {
                id
                title
                content
                excerpt
                slug
                date
                author {
                  node {
                    email
                    firstName
                    id
                  }
                }
              }
            }
          }
        `,
      })
      .valueChanges.subscribe((result: any) => {
        console.log(result);
        this.posts.set(result.data?.posts);
        this.loading.set(false);
        this.error.set(result.error);
      });
  }
}
