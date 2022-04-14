module.exports =
`query providerProfileId($userId: ID) {
      providerProfile(userId: $userId) {
          id
      }
}`;
