import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';

@Component({
  selector: 'app-bloq',
  imports: [],
  templateUrl: './bloq.html',
  styleUrl: './bloq.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Bloq {
  readonly posts = signal<any[]>([]);
  readonly loading = signal(true);
  readonly error = signal<any>(null);

  constructor(private readonly apollo: Apollo) { }

  ngOnInit() {
    this.apollo
      .watchQuery({
        query: gql`
         query post {
            posts {
              nodes {
                content
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
        this.loading.set(false)
        this.error.set(result.error)
      });
  }
}
