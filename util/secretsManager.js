import { SecretsManagerClient, GetSecretValueCommand} from "@aws-sdk/client-secrets-manager";


module.exports.getSecrets = async function getSecrets(){

    const secret_name = "chatnonymousSecrets";

    const client = new SecretsManagerClient({
        region: "us-east-1",
      });
      
    let response;
      
      try {
        response = await client.send(
          new GetSecretValueCommand({
            SecretId: secret_name
        })
        );
      } catch (error) {
        throw error;
      }
      
    return secret = response.SecretString;
}