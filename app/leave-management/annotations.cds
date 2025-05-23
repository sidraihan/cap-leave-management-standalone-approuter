using LeaveService as service from '../../srv/leave-service';
annotate service.LeaveRequests with @(
    UI.FieldGroup #GeneratedGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Label : 'Leave Type',
                Value : type.name,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Leave Start Date',
                Value : startDate,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Leave End Date',
                Value : endDate,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Reason',
                Value : reason,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Leave Status',
                Value : status_code,
                //Criticality: (status.code = 'Approved' ? 3 : (status.code = 'Rejected' ? 1 : 2))
            },
        ],
    },
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'GeneratedFacet1',
            Label : '{i18n>LeaveDetails}',
            Target : '@UI.FieldGroup#GeneratedGroup',
        },
    ],
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Value : employee.name,
            Label : '{i18n>EmployeeName}',
        },
        {
            $Type : 'UI.DataField',
            Label : '{i18n>LeaveType}',
            Value : type.name,
            ![@UI.Importance] : #High,
        },
        {
            $Type : 'UI.DataField',
            Label : '{i18n>LeaveStartDate}',
            Value : startDate,
            ![@UI.Importance] : #High,
        },
        {
            $Type : 'UI.DataField',
            Label : '{i18n>LeaveEndDate}',
            Value : endDate,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Reason',
            Value : reason,
            ![@UI.Importance] : #Low,
        },
        {
            $Type : 'UI.DataField',
            Label : '{i18n>ApprovalStatus}',
            Value : status_code,
            //Criticality: (status.code = 'Approved' ? 3 : (status.code = 'Rejected' ? 1 : 2)),
            ![@UI.Importance] : #High
        },
        {
            $Type : 'UI.DataField',
            Value : approver.name,
            Label : 'Manager Name',
        },
    ],
    UI.SelectionFields : [
        status_code,
        startDate,
        endDate,
        employee_ID,
    ],
    UI.PresentationVariant #vh_LeaveRequests_status : {
        $Type : 'UI.PresentationVariantType',
        SortOrder : [
            {
                $Type : 'Common.SortOrderType',
                Property : status_code,
                Descending : false,
            },
        ],
    },
    UI.HeaderInfo : {
        TypeName : '',
        TypeNamePlural : '',
        Title : {
            $Type : 'UI.DataField',
            Value : employee.name,
        },
        Description : {
            $Type : 'UI.DataField',
            Value : startDate,
        },
    },
    UI.Identification : [
        {
            $Type : 'UI.DataFieldForAction',
            Action : 'LeaveService.approveRequest',
            Label : '{i18n>ApproveLeave}',
        },
        {
            $Type : 'UI.DataFieldForAction',
            Action : 'LeaveService.rejectRequest',
            Label : '{i18n>RejectLeave}',
        },
    ],
);

annotate service.LeaveRequests with {
    employee @(
        Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'Employees',
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : employee_ID,
                    ValueListProperty : 'ID',
                },
                {
                    $Type : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'name',
                },
                {
                    $Type : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'email',
                },
            ],
        },
        Common.Label : '{i18n>EmployeeId}',
        Common.ValueListWithFixedValues : true,
    )
};

annotate service.LeaveRequests with {
    approver @Common.ValueList : {
        $Type : 'Common.ValueListType',
        CollectionPath : 'Employees',
        Parameters : [
            {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : approver_ID,
                ValueListProperty : 'ID',
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'name',
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'email',
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'role',
            },
        ],
    }
};

annotate service.LeaveRequests with {
    status @(
        Common.Label : '{i18n>ApprovalStatus}',
        Common.FieldControl : #ReadOnly,
        )
};

annotate service.LeaveRequests with {
    startDate @Common.Label : '{i18n>LeaveStartDate}'
};

annotate service.LeaveRequests with {
    endDate @Common.Label : '{i18n>LeaveEndDate}'
};

annotate service.LeaveRequests with {
    type @(Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'LeaveTypes',
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : type_code,
                    ValueListProperty : 'code',
                },
            ],
        Label : 'Leave Type',
        },
        Common.ValueListWithFixedValues : false
)};

annotate service.LeaveTypes with {
    code @(Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'LeaveTypes',
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : code,
                    ValueListProperty : 'code',
                },
            ],
            Label : 'Leave Type',
        },
        Common.ValueListWithFixedValues : true,
        Common.FieldControl : #Mandatory,
        )};

annotate service.LeaveTypes with {
    name @(Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'LeaveTypes',
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : name,
                    ValueListProperty : 'code',
                },
            ],
            Label : 'Leave Type',
        },
        Common.ValueListWithFixedValues : true
)};

