module.exports =
`query ClientsAbsences(
    $first: Int!,
    $clientFullName_Icontains: String,
    $locationId_In: String, $servicedByProviderId_In: String,
    $consecutiveAbsenceStreak_Gt: Float,
    $consecutiveAbsenceStreak_Lt: Float,
    $ytdAbsenceCount_Gt: Float,
    $ytdAbsenceCount_Lt: Float,
    $sixtyDayAbsenceRatio_Gt: Float,
    $sixtyDayAbsenceRatio_Gte: Float,
    $sixtyDayAbsenceRatio_Lt: Float,
    $sixtyDayAbsenceRatio_Lte: Float,
    $serviceTypeCode_In: String,
    $schoolYearCode_In: String,
    $status_NotIn: String
){
    clientServices(
        first: $first,
        clientFullName_Icontains: $clientFullName_Icontains,
        locationId_In: $locationId_In,
        servicedByProviderId_In: $servicedByProviderId_In,
        consecutiveAbsenceStreak_Gt: $consecutiveAbsenceStreak_Gt,
        consecutiveAbsenceStreak_Lt: $consecutiveAbsenceStreak_Lt,
        ytdAbsenceCount_Gt: $ytdAbsenceCount_Gt,
        ytdAbsenceCount_Lt: $ytdAbsenceCount_Lt,
        sixtyDayAbsenceRatio_Gt: $sixtyDayAbsenceRatio_Gt,
        sixtyDayAbsenceRatio_Gte: $sixtyDayAbsenceRatio_Gte,
        sixtyDayAbsenceRatio_Lt: $sixtyDayAbsenceRatio_Lt,
        sixtyDayAbsenceRatio_Lte: $sixtyDayAbsenceRatio_Lte,
        serviceTypeCode_In: $serviceTypeCode_In,
        schoolYearCode_In: $schoolYearCode_In,
        status_NotIn: $status_NotIn
    ) {
        totalCount
    }
}`;
