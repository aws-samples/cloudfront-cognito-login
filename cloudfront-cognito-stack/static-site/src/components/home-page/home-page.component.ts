import { Component, OnInit, Input} from '@angular/core';
import jwt_decode, { JwtPayload } from 'jwt-decode';
import { ActivatedRoute } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css']
})

export class HomePageComponent implements OnInit{


  isPremium = false;
  isLoggedIn = false;
  loggedIn = false;

  //  Read from cookie named token
  constructor(private cookieService:CookieService, private httpClient: HttpClient) { }

  ngOnInit(){
    let cookieValue = this.cookieService.get('token');
    if (cookieValue){
      this.loggedIn = true;
    }

    console.log(jwt_decode(cookieValue))
    if (cookieValue != null){
      this.isLoggedIn = true;
    }

    // interface defining the JWT response
    interface JWT {
      sub: string,
      "cognito:groups" : string,
      email_verified: boolean,
      iss: string,
      given_name: string,
      aud: string,
      token_use: number,
      auth_time: number,
      nickname: string,
      exp: number,
      iat: number,
      email: string,
      username: string
    }
    let decodedCookie = jwt_decode<JWT>(cookieValue);
    console.log(decodedCookie['cognito:groups']);

    if(decodedCookie['cognito:groups'] && decodedCookie['cognito:groups'].includes("premium")) {
      this.isPremium = true;
    }
  }


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
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cookieValue}`
    });
    let options = { headers: headers };
    console.log(options)
  
    this.httpClient.post("", request, options).subscribe(
      res => {
        console.log(res);
      },
    )
      this.isPremium = true;
    // window.location.reload()
  }



  public logout(){
    this.cookieService.delete('token', '/');
    window.location.reload()
  }


}
