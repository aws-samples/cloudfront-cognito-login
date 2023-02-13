import { Component, OnInit} from '@angular/core';
import jwt_decode, { JwtPayload } from 'jwt-decode';
import { ActivatedRoute } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css']
})

export class HomePageComponent implements OnInit{

  isPremium = false;

  //  Read from cookie named token
  constructor(private cookieService:CookieService) { }

  ngOnInit(){

    // TODO figure out why json parsing error
    let cookieValue = this.cookieService.get('token');
    // console.log(cookieValue);
    console.log(jwt_decode(cookieValue))

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
      email: string
    }
    let decodedCookie = jwt_decode<JWT>(cookieValue);
    console.log(decodedCookie['cognito:groups']);

    if(decodedCookie['cognito:groups'] && decodedCookie['cognito:groups'].includes("premium")) {
      this.isPremium = true;
    }
  }
}
