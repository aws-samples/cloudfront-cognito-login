import { Component, OnInit, EventEmitter, Output} from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import jwt_decode, { JwtPayload } from 'jwt-decode';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit{
  constructor(private cookieService:CookieService, private httpClient: HttpClient) { }

  loggedIn = false;


  public async joinPremium(){

    let cookieValue = this.cookieService.get('token');
    interface JWT {
      username: string
    }
    let decodedCookie = jwt_decode<JWT>(cookieValue);

    let request = {
      username: decodedCookie.username
    };
    console.log(request);
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    let options = { headers: headers };
    console.log(options)
  
    this.httpClient.post("https://fw92950zsh.execute-api.us-east-1.amazonaws.com/prod", request, options).subscribe(
      res => {
        console.log(res);
      },
    )

    // window.location.reload()
  }

  public logout(){

    // this.httpClient.get("https://chatnonymous.auth.us-east-1.amazoncognito.com/logout?client_id=5ep7g78r5q9ki13oa3pebqgl4s?logout_uri=https://d3bi4zi96h8wdp.cloudfront.net/index.html").subscribe(
    //   res => {
    //     console.log(res);
    //   },
    // )
    this.cookieService.delete('token', '/');
  }
  ngOnInit() {
    let cookieValue = this.cookieService.get('token');
    if (cookieValue){
      this.loggedIn = true;
    }
  }
}
